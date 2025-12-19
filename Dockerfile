FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S -G app -h /app app

# Copy the jar built by ./mvnw clean package -DskipTests
COPY target/demo-0.0.1-SNAPSHOT.jar app.jar

RUN chown -R app:app /app

USER app

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
