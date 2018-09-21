require "json"

require "sinatra"
require "sequel"

configure :development do
  set :bind, "0.0.0.0"
end

configure :production do
  set :port, 80
  set :bind, "188.166.92.132"
end

DEFAULT_MAP = "map_1"

# Connect to the database.
DB = Sequel.connect(ENV["DATABASE_PATH"])

# TODO There is a slight bug here. Every time we restart the server, there is a 50% chance that the
#      previously last game will be left without a second player.
last_game_id = (DB[:game_commands].max(:game_id) || 0) + 1
has_open_game = true

get "/games/new" do
  if has_open_game
    last_game_id += 1
    has_open_game = false
  else
    has_open_game = true
  end

  side = has_open_game ? "rebel" : "imperial"

  redirect to("/games/#{last_game_id}/#{side}")
end

get "/games/:game_id/:side" do
  erb :game, locals: {
    game_id: params["game_id"],
    side: params["side"],
    map: params["map"] || DEFAULT_MAP,
    turn: params["turn"] || "last",
  }
end

post "/games/:game_id/commands" do
  json = JSON.parse(params["command"])

  DB[:game_commands].insert(
    game_id: params["game_id"],
    turn: json["turn"],
    command: json["command"],
    serialized_args: json["args"].to_json,
  )

  return "ok"
end

get "/games/:game_id/commands/:turn" do
  turn_commands = DB[:game_commands].where(game_id: params["game_id"], turn: params["turn"]).all

  out_commands = turn_commands.map do |command|
    {
      "id" => command[:id],
      "command" => command[:command],
      "args" => JSON.parse(command.delete(:serialized_args)),
    }
  end

  return out_commands.to_json
end
