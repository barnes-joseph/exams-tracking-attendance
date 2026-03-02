#!/bin/bash

# 🚀 Exam Attendance Tracking - Quick Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: local (default), production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV=${1:-local}
COMPOSE_FILE="docker-compose.yml"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🎓 Exam Attendance Tracking - Docker Deployment     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Determine docker compose command
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please edit the .env file with your actual values before continuing.${NC}"
        echo ""
        echo "   nano .env"
        echo ""
        read -p "Press Enter to continue after editing .env..."
    else
        echo -e "${RED}❌ .env.example not found. Please create a .env file manually.${NC}"
        exit 1
    fi
fi

# Display environment info
echo -e "${BLUE}📋 Deployment Information:${NC}"
echo -e "   Environment: ${GREEN}$ENV${NC}"
echo -e "   Compose File: ${GREEN}$COMPOSE_FILE${NC}"
echo ""

# Function to check if containers are running
are_containers_running() {
    $DOCKER_COMPOSE ps | grep -q "Up"
}

# Parse command
case "${2:-deploy}" in
    deploy|up|start)
        echo -e "${BLUE}🏗️  Building and starting containers...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE up -d --build
        echo ""
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo -e "${BLUE}📊 Services:${NC}"
        echo -e "   Frontend: ${GREEN}http://localhost${NC} (or your server IP)"
        echo -e "   Backend:  ${GREEN}http://localhost:3000${NC}"
        echo -e "   Health:   ${GREEN}http://localhost:3000/health${NC}"
        echo ""
        echo -e "${BLUE}📋 View logs:${NC} $DOCKER_COMPOSE logs -f"
        ;;

    stop|down)
        echo -e "${BLUE}🛑 Stopping containers...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE down
        echo -e "${GREEN}✅ Containers stopped${NC}"
        ;;

    restart)
        echo -e "${BLUE}🔄 Restarting containers...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE restart
        echo -e "${GREEN}✅ Containers restarted${NC}"
        ;;

    rebuild)
        echo -e "${BLUE}🏗️  Rebuilding containers...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE down
        $DOCKER_COMPOSE -f $COMPOSE_FILE up -d --build
        echo -e "${GREEN}✅ Rebuild complete${NC}"
        ;;

    logs)
        echo -e "${BLUE}📋 Viewing logs...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f
        ;;

    status|ps)
        echo -e "${BLUE}📊 Container Status:${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE ps
        echo ""
        if are_containers_running; then
            echo -e "${GREEN}✅ All services are running${NC}"
        else
            echo -e "${RED}⚠️  Some services are not running${NC}"
        fi
        ;;

    update|pull)
        echo -e "${BLUE}📥 Pulling latest changes...${NC}"
        git pull origin main || echo -e "${YELLOW}⚠️  Could not pull from git${NC}"
        echo -e "${BLUE}🏗️  Rebuilding containers...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE pull
        $DOCKER_COMPOSE -f $COMPOSE_FILE up -d --build
        echo -e "${GREEN}✅ Update complete${NC}"
        ;;

    shell|exec)
        SERVICE=${3:-backend}
        echo -e "${BLUE}🔧 Opening shell in $SERVICE...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE exec $SERVICE sh || $DOCKER_COMPOSE -f $COMPOSE_FILE exec $SERVICE bash
        ;;

    clean)
        echo -e "${YELLOW}⚠️  This will remove all containers, networks, and volumes!${NC}"
        read -p "Are you sure? (y/N): " confirm
        if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
            $DOCKER_COMPOSE -f $COMPOSE_FILE down -v --remove-orphans
            docker system prune -f
            echo -e "${GREEN}✅ Cleanup complete${NC}"
        else
            echo -e "${BLUE}❎ Cancelled${NC}"
        fi
        ;;

    seed)
        echo -e "${BLUE}🌱 Running database seeder...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE exec backend npm run seed || echo -e "${YELLOW}⚠️  Seeder not available or already run${NC}"
        ;;

    help|-h|--help)
        echo "Usage: ./deploy.sh [environment] [command]"
        echo ""
        echo "Environments:"
        echo "  local         Local development (default)"
        echo "  production    Production deployment"
        echo ""
        echo "Commands:"
        echo "  deploy, up    Build and start containers (default)"
        echo "  stop, down    Stop and remove containers"
        echo "  restart       Restart containers"
        echo "  rebuild       Rebuild and restart containers"
        echo "  logs          View container logs"
        echo "  status, ps    Show container status"
        echo "  update, pull  Pull latest changes and rebuild"
        echo "  shell [svc]   Open shell in container (default: backend)"
        echo "  clean         Remove all containers and volumes"
        echo "  seed          Run database seeder"
        echo "  help          Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh                    # Deploy locally"
        echo "  ./deploy.sh production         # Deploy to production"
        echo "  ./deploy.sh local logs         # View logs"
        echo "  ./deploy.sh local shell        # Open backend shell"
        echo "  ./deploy.sh local shell frontend # Open frontend shell"
        ;;

    *)
        echo -e "${RED}❌ Unknown command: $2${NC}"
        echo "   Run './deploy.sh help' for usage information"
        exit 1
        ;;
esac

echo ""