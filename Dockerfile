# Pull official base node image
FROM node:14 as builder

# Set working directory
WORKDIR /app

# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install node dependencies
COPY package.json ./
RUN npm install
RUN npm install fetch

# START - PROTOBUF INSTALLATION
RUN apt-get update && \
    apt-get -y install git unzip build-essential autoconf libtool


RUN git clone https://github.com/google/protobuf.git && \
    cd protobuf && \
    ./autogen.sh && \
    ./configure && \
    make && \
    make install && \
    ldconfig && \
    make clean && \
    cd .. && \
    rm -r protobuf

RUN curl -OL https://github.com/grpc/grpc-web/releases/download/1.2.1/protoc-gen-grpc-web-1.2.1-linux-x86_64
RUN mv protoc-gen-grpc-web-1.2.1-linux-x86_64 /usr/bin/protoc-gen-grpc-web
RUN chmod +x /usr/bin/protoc-gen-grpc-web
# END - PROTOBUF INSTALLATION

# COPY PROJECT FILES 
COPY . ./

# COMPILE THE PROTO FILES
RUN protoc -I=/app/src/woz-app/connector/agent-dialogue/proto \
client.proto \
core_configuration.proto \
log.proto \
ratings.proto \
service.proto \ 
simulator_configuration.proto \ 
--js_out=import_style=commonjs:/app/src/woz-app/connector/agent-dialogue/generated \
--grpc-web_out=import_style=typescript,mode=grpcwebtext:/app/src/woz-app/connector/agent-dialogue/generated


# COMPILE DISTRIBUTION BUILD 
RUN npm run build

# NGINX SETUP 
FROM nginx:latest
COPY --from=builder /app/dist/woz /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
