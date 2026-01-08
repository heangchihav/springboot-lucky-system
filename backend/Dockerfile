FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace

ARG MODULE

COPY backend backend

RUN --mount=type=cache,target=/root/.m2 \
    mvn -f backend/pom.xml -pl ${MODULE} -am -DskipTests clean package \
    -Dmaven.wagon.http.retryHandler.count=5 \
    -Dmaven.wagon.http.retryHandler.requestSentEnabled=true

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

ARG MODULE

RUN addgroup -S app && adduser -S -G app -h /app app

# Install curl for container health checks
RUN apk add --no-cache curl

# Copy the jar built by ./mvnw clean package -DskipTests
COPY --from=build /workspace/backend/${MODULE}/target/*-SNAPSHOT.jar app.jar

RUN chown -R app:app /app

USER app

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
