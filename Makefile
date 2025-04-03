.PHONY: setup run backend frontend build clean

# Setup environment and dependencies
setup:
	python3 -m venv venv
	. venv/bin/activate && pip install -r requirements.txt
	cd frontend && npm install

# Run both backend and frontend
run:
	./run.sh

# Run only the backend
backend:
	. venv/bin/activate && python server.py

# Run only the frontend
frontend:
	cd frontend && npm start

# Build the React frontend for production
build:
	cd frontend && npm run build

# Clean up generated files
clean:
	rm -rf frontend/build
	rm -rf frontend/node_modules
	find . -type d -name "__pycache__" -exec rm -rf {} +

# Display help information
help:
	@echo "Available commands:"
	@echo "  make setup    - Set up the environment and install dependencies"
	@echo "  make run      - Run both backend and frontend"
	@echo "  make backend  - Run only the backend"
	@echo "  make frontend - Run only the frontend"
	@echo "  make build    - Build the frontend for production"
	@echo "  make clean    - Clean up generated files" 