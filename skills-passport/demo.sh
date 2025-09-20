#!/bin/bash

# Skills Passport MVP Demo Script
# This script demonstrates the complete end-to-end functionality

set -e

echo "🚀 Skills Passport MVP Demo"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        print_success "Docker found - containerized setup available"
    else
        print_warning "Docker not found - will use local setup"
    fi
    
    print_success "Prerequisites check completed"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Create .env files if they don't exist
    if [ ! -f "backend/.env" ]; then
        print_status "Creating backend/.env from template..."
        cp backend/.env.example backend/.env
        print_warning "Please update backend/.env with your OpenAI API key before continuing"
    fi
    
    if [ ! -f "docker/.env" ]; then
        print_status "Creating docker/.env from template..."
        cp docker/.env.example docker/.env
        print_warning "Please update docker/.env with your OpenAI API key for Docker setup"
    fi
    
    print_success "Environment setup completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    # AI services dependencies
    print_status "Installing AI services dependencies..."
    cd ai-services
    npm install
    cd ..
    
    print_success "All dependencies installed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if Docker is available and PostgreSQL container is running
    if command -v docker &> /dev/null && docker ps | grep -q "skills-passport-db"; then
        print_success "PostgreSQL container is already running"
    elif command -v docker &> /dev/null; then
        print_status "Starting PostgreSQL container..."
        cd docker
        docker-compose up -d postgres
        cd ..
        
        # Wait for database to be ready
        print_status "Waiting for database to be ready..."
        sleep 10
    else
        print_warning "Docker not available. Please ensure PostgreSQL is running locally."
        print_warning "Database URL should be: postgresql://postgres:postgres@localhost:5432/skills_passport"
    fi
    
    # Run Prisma setup
    print_status "Setting up Prisma..."
    cd backend
    npx prisma generate
    npx prisma db push
    cd ..
    
    print_success "Database setup completed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # AI services tests
    print_status "Running AI services tests..."
    cd ai-services
    npm test
    cd ..
    
    print_success "All tests passed"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start backend
    print_status "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 5
    
    # Start frontend
    print_status "Starting frontend server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for services to start
    sleep 10
    
    print_success "Services started successfully!"
    print_success "Frontend: http://localhost:3000"
    print_success "Backend API: http://localhost:3001"
    
    # Store PIDs for cleanup
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid
}

# Demo workflow
demo_workflow() {
    print_status "Demo Workflow Instructions:"
    echo ""
    echo "1. 📝 Register/Login:"
    echo "   - Open http://localhost:3000"
    echo "   - Create a new account or login"
    echo ""
    echo "2. 📄 Upload CV:"
    echo "   - Click 'Upload CV' or go to /upload"
    echo "   - Upload a PDF, DOCX, or TXT resume"
    echo "   - Watch the processing status"
    echo ""
    echo "3. 🤖 AI Processing:"
    echo "   - CV is parsed using OpenAI GPT-4"
    echo "   - Skills are extracted and categorized"
    echo "   - Personal information is anonymized"
    echo ""
    echo "4. 👤 View Profile:"
    echo "   - Go to Dashboard to see your uploads"
    echo "   - Click 'View Profile' to see anonymized profile"
    echo "   - Explore skills radar chart and work experience"
    echo ""
    echo "5. 🔗 Share Profile:"
    echo "   - Copy the public profile link"
    echo "   - Share anonymized profile with others"
    echo ""
    echo "6. 📊 Features to Test:"
    echo "   - Skills visualization with radar chart"
    echo "   - Anonymized company names (Company A, Company B)"
    echo "   - Professional summary generation"
    echo "   - Work experience timeline"
    echo "   - Skills categorization and proficiency levels"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend health check failed"
        return 1
    fi
    
    print_success "All services are healthy"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Kill background processes
    if [ -f .backend.pid ]; then
        kill $(cat .backend.pid) 2>/dev/null || true
        rm .backend.pid
    fi
    
    if [ -f .frontend.pid ]; then
        kill $(cat .frontend.pid) 2>/dev/null || true
        rm .frontend.pid
    fi
    
    print_success "Cleanup completed"
}

# Trap cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    echo ""
    print_status "Starting Skills Passport MVP Demo..."
    echo ""
    
    case "${1:-full}" in
        "check")
            check_prerequisites
            ;;
        "setup")
            check_prerequisites
            setup_environment
            install_dependencies
            setup_database
            ;;
        "test")
            run_tests
            ;;
        "start")
            start_services
            health_check
            demo_workflow
            echo ""
            print_success "Demo is ready! Press Ctrl+C to stop services."
            wait
            ;;
        "docker")
            print_status "Starting with Docker..."
            cd docker
            docker-compose up -d
            cd ..
            sleep 15
            health_check
            demo_workflow
            echo ""
            print_success "Docker demo is ready! Use 'docker-compose down' to stop."
            ;;
        "full"|*)
            check_prerequisites
            setup_environment
            install_dependencies
            setup_database
            run_tests
            start_services
            health_check
            demo_workflow
            echo ""
            print_success "Full demo is ready! Press Ctrl+C to stop services."
            wait
            ;;
    esac
}

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Skills Passport MVP Demo Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  full     - Complete setup and demo (default)"
    echo "  check    - Check prerequisites only"
    echo "  setup    - Setup environment and dependencies"
    echo "  test     - Run tests only"
    echo "  start    - Start services only"
    echo "  docker   - Use Docker setup"
    echo ""
    echo "Examples:"
    echo "  $0           # Full demo"
    echo "  $0 docker    # Docker demo"
    echo "  $0 setup     # Setup only"
    exit 0
fi

# Run main function
main "$@"
