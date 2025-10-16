# Dockerfile for Fragments Microservice

# This file defines how to build a Docker image of our fragments repository.
# It installs dependencies, copies source code, sets environment variables,
# and defines how to start the server when the container runs.

# Using Node version matching local dev environment
FROM node:22.12.0

# Metadata
LABEL maintainer="Aydin Arif <aarif24@myseneca.ca>"
LABEL description="Fragments Node.js microservice"

# Environment variables
# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when ran inside Docker
ENV NPM_CONFIG_COLOR=false

# Create and use /app as working directory
WORKDIR /app

# Copy package definition files
COPY package*.json ./

# Installing dependencies
RUN npm install

# Copy app source code
COPY ./src ./src

# Copy the .htpasswd file for Basic Auth
COPY ./tests/.htpasswd ./tests/.htpasswd

# Expose the port our service runs on
EXPOSE 8080

# Default command to start the app
CMD npm start
