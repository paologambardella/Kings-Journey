# Start with a ruby image
FROM ruby:2.1.6

# Install node (for typescript compiler)
ENV NODE_VERSION 0.12.4
ENV NPM_VERSION 2.10.1
RUN curl -SLO "http://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz" \
    && tar -xzf "node-v$NODE_VERSION-linux-x64.tar.gz" -C /usr/local --strip-components=1 \
    && rm "node-v$NODE_VERSION-linux-x64.tar.gz" \
    && npm install -g npm@"$NPM_VERSION" \
    && npm cache clear

# Install the typescript compiler
RUN npm install -g typescript

# Install gem dependencies
RUN apt-get install libsqlite3-dev

# Prepare some directories
RUN mkdir /app
RUN mkdir /data

# Set the directory from where to run commands
WORKDIR /app

# Install the gems
COPY Gemfile /app/
COPY Gemfile.lock /app/
RUN bundle install

# Migrate the database
COPY migrations /app/migrations
ENV DATABASE_PATH sqlite:///data/kj.db
RUN sequel -m migrations "$DATABASE_PATH"

# Copy all the code
COPY . /app

# Compile the typescript files (it looks for `tsconfig.json`)
RUN tsc

# Fire up the server!
CMD ["ruby", "server.rb"]
