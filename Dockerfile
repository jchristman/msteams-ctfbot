FROM debian:latest

# Set the shell to bash
SHELL ["/bin/bash", "-c"]

# Make sure all is up to date
RUN apt-get update && apt-get upgrade -y

# Prereqs for mysql dpkg
RUN apt-get install -y wget lsb-release gnupg

RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | apt-key add -
RUN echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.2 main" | tee /etc/apt/sources.list.d/mongodb-org-4.2.list

RUN apt-get update

# Install some tools
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
    curl git build-essential procps file lsof \
    mongodb-org

RUN mkdir -p /data/db

# Install node
RUN curl -sL https://deb.nodesource.com/setup_13.x | bash -
RUN apt-get install -y nodejs
RUN npm install -g npm

# Install gulp and yarn
RUN npm install -g gulp yarn

# Create a user to setup for developing
RUN useradd -ms /bin/bash dev
RUN echo 'dev ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Allow user to install npm modules
RUN chown -R dev:dev /usr/lib/node_modules
RUN chown -R dev:dev /data

USER dev

WORKDIR /home/dev
RUN tail -n +10 /home/dev/.bashrc > /home/dev/.bashrc
RUN echo >> /home/dev/.bashrc
RUN echo 'export LC_CTYPE=C.UTF-8' >> /home/dev/.bashrc

# And setup the workspace
RUN mkdir /home/dev/workspace
WORKDIR /home/dev/workspace

COPY package.json .
RUN npm install
COPY . .
RUN npm run transpile

ENV PORT=8888
EXPOSE 8888

CMD npm run start
