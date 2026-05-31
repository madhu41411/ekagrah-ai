FROM node:22-alpine

WORKDIR /app

# Install serve to host static files
RUN npm install -g serve

# Copy marketing website files
COPY public/ ./

# Expose port
EXPOSE 8080

# Start the server
CMD ["serve", "-s", ".", "-l", "8080"]
