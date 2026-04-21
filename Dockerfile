# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /src

# Copy the package.json and package-lock.json (if available)
COPY package*.json ./

# Install the dependencies
RUN npm install --production

# Copy the application source code
COPY . .

WORKDIR /workflows
ENV WORKFLOWS_DIR=/workflows

# Set the entry point for the container to run the CLI
# Replace 'your-cli-command' with the actual command of your CLI app
ENTRYPOINT ["/src/entrypoint.sh"]

