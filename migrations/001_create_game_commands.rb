Sequel.migration do
  change do
    create_table :game_commands do
      primary_key :id
      Integer :game_id
      Integer :turn
      String :command
      String :serialized_args
    end
  end
end
