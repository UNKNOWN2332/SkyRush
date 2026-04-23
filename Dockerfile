# Build bosqichi
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Gradle-ni o'rnatish
RUN apt-get update && apt-get install -y wget unzip
RUN wget https://services.gradle.org/distributions/gradle-8.5-bin.zip -P /tmp && \
    unzip -d /opt/gradle /tmp/gradle-8.5-bin.zip && \
    ln -s /opt/gradle/gradle-8.5/bin/gradle /usr/bin/gradle

COPY . .

# Loyihani build qilish (wrapper-siz, o'rnatilgan gradle orqali)
RUN gradle bootJar --no-daemon

# Run bosqichi
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]