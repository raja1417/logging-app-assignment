{{- define "logging-app.fullname" -}}
hotel-logging
{{- end -}}

{{- define "logging-app.labels" -}}
app: hotel-logging
{{- end -}}

{{- define "logging-app.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{ default (include "logging-app.fullname" .) .Values.serviceAccount.name }}
{{- else -}}
{{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}
