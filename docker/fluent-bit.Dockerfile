FROM fluent/fluent-bit:latest
WORKDIR /fluent-bit/
COPY helm/templates/fluentbit-configmap.yaml /fluent-bit/fluent-bit.conf
RUN chmod 644 /fluent-bit/fluent-bit.conf
CMD ["fluent-bit", "-c", "/fluent-bit/fluent-bit.conf"]
