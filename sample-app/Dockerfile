FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

ENV ENVIRONMENT=dev
ENV PORT=8080
ENV DB_PATH=/app/data/devops-challenge.db

RUN mkdir -p /app/data

EXPOSE 8080

CMD ["python", "app.py"]
