FROM httpd:latest
WORKDIR /usr/local/apache2/htdocs/
COPY src/index.html .
RUN mkdir -p /usr/local/apache2/logs/
RUN chmod -R 777 /usr/local/apache2/logs/
EXPOSE 80
CMD ["httpd", "-D", "FOREGROUND"]
