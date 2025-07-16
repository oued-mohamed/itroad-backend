# docs/architecture.md

# Adherant Platform Architecture

## Overview

The Adherant Platform is a microservices-based application designed for member/user management with document handling capabilities. The architecture follows a distributed pattern with separate services for different concerns.

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐
│   Frontend      │    │   API Gateway    │
│   (React/Vue)   │◄──►│   (Port 3000)    │
└─────────────────┘    └──────────┬───────┘
                                  │
                       ┌──────────▼───────────┐
                       │    Load Balancer     │
                       └──────────┬───────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
    ┌──────▼──────┐    ┌─────────▼──────┐    ┌─────────▼──────┐
    │ Auth Service│    │Profile Service │    │Document Service│
    │ (Port 3001) │