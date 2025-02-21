# logging-app-assignment

Issue: Online Hotel booking System is having performance issue . Issue was identified due to huge logging being done by system which is resulting in high resource utilization hampering the performance.

solution: containerize the application with docker and orchestrate the container using kubernetes for high availability and proper scaling.

Tech stack used:
1. GIT- SCM
2. Docker
3. kubernetes
4. Splunk
5. Azure DevOps pipelines (ADOPS) for CI/CD

Steps:

1. for this usecase, we can have 2 docker containers. one as a webserver with src details and another sidecar container that runs alonside the main webserver container collecting it's logs and forwarding to splunk where they can be parsed as we need.
2. for the webserver, we can use the official httpd docker image with steps as shown below.

FROM httpd:latest                       # gets the latest httpd image from docker hub --> ref: https://hub.docker.com/_/httpd
WORKDIR /usr/local/apache2/htdocs/      # Set working directory
COPY src/index.html .                   # Copy index.html (didnt write any index.html scripts. just imagining it's there for UI purposes)
RUN mkdir -p /usr/local/apache2/logs/   # Create logs directory with correct permissions
RUN chmod -R 755 /usr/local/apache2/logs/
EXPOSE 80                                  #Expose HTTP port
CMD ["httpd", "-D", "FOREGROUND"]          # Start Apache in foreground

3. For the sidecar, we can use the lightweight fluent-bit log processor which can run alonside the web container and get the logs , push it to a path where the splunk can read and process.

FROM fluent/fluent-bit:latest      # gets the official fluent-bit image from docker-hub-->/hub.docker.com/r/fluent/fluent-bit
WORKDIR /fluent-bit/
COPY fluent-bit.conf /fluent-bit/etc/fluent-bit.conf  # Copy configuration files
COPY parsers.conf /fluent-bit/etc/parsers.conf        
RUN chown fluent:fluent /fluent-bit/etc/*.conf        # ensures right ownership
USER fluent                                           # Switch to non-root user
ENV FLUENT_BIT_CONFIG="/fluent-bit/etc/fluent-bit.conf" # Set Fluent Bit config environment variable. we can either set this here or in the kubernetes manifests. 
CMD ["/fluent-bit/bin/fluent-bit", "-c", "/fluent-bit/etc/fluent-bit.conf"] # starts the fluent-bit log processor.

4. For fluent-bit to work properly and get the logs from different paths, we need to have a fluent-bit.conf and parser.conf files which we can get from , ref: https://github.com/fluent/fluent-bit/blob/master/conf/fluent-bit.conf. they are mentioned in the config map.
5. once we have the docker files in place, we can build them using the docker commands that are mentioned later in the pipeline script.

Kubernetes manifests:

1. Once the docker images are built and pushed to the registries, we can focus on deploying them to kubernetes.
2. in kubernetes side, let's imagine we are using any cloud based clusters. and we login through kubeconfig.yaml.
3. we need deployment manifests, service manifest, config-map and secret manifest.
4. For this assignment, all the manifests templates are referred from the following public sites:
https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
https://kubernetes.io/docs/concepts/configuration/configmap/
https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/
https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/
https://kubernetes.io/docs/concepts/configuration/secret/
https://kubernetes.io/docs/tasks/configure-pod-container/configure-volume-storage/

5. We could have used helm charts for easing these deployments in a single shot but due to time constraints I had to rely on manual yaml creation and deployment. Refer to the repo path k8s-manifests/ for manifest files.
6. deployment manifest has 3 replicas defined, 2 containers - 1 main and 1 sidecar, volume mounts , secret reference parameter and configMap parameter. The strategy is rolling update to minimise downtime.
7. configmap has fluent-bit config file that has instuctions for fleunt-bit to get it's logs from the web application. The Fluent Bit sidecar collects logs from the web server and processes them using custom parsers. Logs are forwarded to Splunk, where they can be indexed, searched, and analyzed for system performance insights. This setup ensures efficient log management without overwhelming the application.
8. secret manifest has the splunk secret and service of type Nodeport, allocates a static port to the pod and exposes the pod IP via that port for external access.

CI/CD pipeline: Ref: https://learn.microsoft.com/en-us/azure/devops/pipelines/ecosystems/kubernetes/deploy?view=azure-devops

I have used Azure devops for the CI/CD pipeline automation. The builds, pushes, and deploys containers to Kubernetes. It has step by step instruction of the commands to perform in each stage right from building the docker image, pushing the docker image to registry, logging into k8s, initiating the deployments. This approach enhances reliability, reduces manual effort, and enables faster issue resolution.

result:

Fluent Bit collects logs from /usr/local/apache2/logs/access.log, extracts fields using parsers.conf, and sends them to Splunk via HTTP Event Collector (HEC). Splunk receives logs, processes them with the assigned sourcetype (fluentbit_logs), and stores them in an index for querying. Splunk query extracts words, counts occurrences, and formats the output as per the user requirement.

example assumption of splunk log output for our usecase:

index="hotel_logs" sourcetype="fluentbit_logs" | rex field=_raw "(?<words>\w+)" max_match=100 | mvexpand words | stats count by words | sort - count

INFO – 3 times
message – 3 times
is – 2 times
the – 2 times
This – 1 time
Goa – 1 time
best – 1 time
