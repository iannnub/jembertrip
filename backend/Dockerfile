FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 7860

# Run the FastAPI application on port 7860 (Hugging Face Spaces default port)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
