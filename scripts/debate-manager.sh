#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_menu() {
    clear
    echo -e "${BLUE}========================================"
    echo "    DEBATE SYSTEM MANAGER"
    echo "========================================${NC}"
    echo
    echo "1. Setup Database (First time)"
    echo "2. Start Development"
    echo "3. Start Production"
    echo "4. Stop All Services"
    echo "5. View Logs"
    echo "6. Database Management"
    echo "7. Clean Everything"
    echo "8. Exit"
    echo
}

setup_database() {
    echo -e "${YELLOW}Setting up database...${NC}"
    chmod +x scripts/setup-debate-db.sh
    ./scripts/setup-debate-db.sh
    read -p "Press Enter to continue..."
}

start_development() {
    echo -e "${YELLOW}Starting development environment...${NC}"
    docker-compose -f docker-compose.dev.yml up -d
    echo
    echo -e "${GREEN}Development environment started!${NC}"
    echo "API: http://localhost:51213"
    echo "WebSocket: ws://localhost:51213/debate"
    echo "pgAdmin: http://localhost:8080"
    echo "Redis Commander: http://localhost:8081"
    read -p "Press Enter to continue..."
}

start_production() {
    echo -e "${YELLOW}Starting production environment...${NC}"
    echo "Make sure you have set up .env.production file!"
    docker-compose -f docker-compose.prod.yml up -d
    echo
    echo -e "${GREEN}Production environment started!${NC}"
    read -p "Press Enter to continue..."
}

stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.prod.yml down
    echo
    echo -e "${GREEN}All services stopped!${NC}"
    read -p "Press Enter to continue..."
}

view_logs() {
    echo -e "${YELLOW}Viewing logs...${NC}"
    docker-compose logs -f
}

db_management() {
    while true; do
        clear
        echo -e "${BLUE}Database Management:${NC}"
        echo "1. Open Prisma Studio"
        echo "2. Reset Database"
        echo "3. Seed Database"
        echo "4. Generate Prisma Client"
        echo "5. Back to Main Menu"
        echo
        read -p "Choose an option (1-5): " dbchoice

        case $dbchoice in
            1)
                echo -e "${YELLOW}Opening Prisma Studio...${NC}"
                npx prisma studio
                ;;
            2)
                echo -e "${YELLOW}Resetting database...${NC}"
                npx prisma migrate reset --force
                npx prisma db seed
                ;;
            3)
                echo -e "${YELLOW}Seeding database...${NC}"
                npx prisma db seed
                ;;
            4)
                echo -e "${YELLOW}Generating Prisma client...${NC}"
                npx prisma generate
                ;;
            5)
                break
                ;;
            *)
                echo -e "${RED}Invalid option!${NC}"
                ;;
        esac
        read -p "Press Enter to continue..."
    done
}

clean_everything() {
    echo -e "${RED}WARNING: This will remove all containers, volumes, and data!${NC}"
    read -p "Are you sure? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        echo -e "${YELLOW}Cleaning everything...${NC}"
        docker-compose down -v
        docker-compose -f docker-compose.dev.yml down -v
        docker-compose -f docker-compose.prod.yml down -v
        docker system prune -f
        echo
        echo -e "${GREEN}Everything cleaned!${NC}"
    else
        echo "Clean cancelled."
    fi
    read -p "Press Enter to continue..."
}

# Main loop
while true; do
    show_menu
    read -p "Choose an option (1-8): " choice

    case $choice in
        1) setup_database ;;
        2) start_development ;;
        3) start_production ;;
        4) stop_services ;;
        5) view_logs ;;
        6) db_management ;;
        7) clean_everything ;;
        8) 
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option!${NC}"
            read -p "Press Enter to continue..."
            ;;
    esac
done
