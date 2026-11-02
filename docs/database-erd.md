# Database Entity-Relationship Diagram (ERD)

This document visualizes the 8-table relational schema powering the multi-tenant collaborative Kanban board.

```mermaid
erDiagram
    ORGANIZATION ||--o{ TENANT : "has many (branches/workspaces)"
    ORGANIZATION ||--o{ USER : "employs"
    
    TENANT ||--o{ MEMBERSHIP : "has members"
    USER ||--o{ MEMBERSHIP : "belongs to tenants"

    TENANT ||--o{ BOARD : "owns boards"
    BOARD ||--o{ COLUMN : "contains columns"
    COLUMN ||--o{ TASK : "contains tasks"
    USER ||--o{ TASK : "assigned to"

    TENANT ||--o{ ACTIVITY_LOG : "scoped activity"
    USER ||--o{ ACTIVITY_LOG : "performed by"

    ORGANIZATION {
        string id PK "UUID"
        string name "Company Name"
        datetime created_at
        datetime updated_at
    }

    TENANT {
        string id PK "UUID"
        string organization_id FK "References organizations.id (CASCADE)"
        string name "Workspace / Branch (e.g. Bangalore, Hyderabad)"
        datetime created_at
    }

    USER {
        string id PK "UUID"
        string organization_id FK "References organizations.id (CASCADE)"
        string email UK "Unique login"
        string password_hash "Bcrypt hash"
        string name "Full Name"
        string role "ORG_ADMIN | MEMBER"
        datetime created_at
    }

    MEMBERSHIP {
        string id PK "UUID"
        string user_id FK "References users.id (CASCADE)"
        string tenant_id FK "References tenants.id (CASCADE)"
        string role "TENANT_ADMIN | MEMBER"
        datetime created_at
    }

    BOARD {
        string id PK "UUID"
        string tenant_id FK "References tenants.id (CASCADE)"
        string title "Board Name"
        datetime created_at
    }

    COLUMN {
        string id PK "UUID"
        string board_id FK "References boards.id (CASCADE)"
        string title "e.g. To Do, In Progress, Done"
        int position "Sort order"
    }

    TASK {
        string id PK "UUID"
        string column_id FK "References columns.id (CASCADE)"
        string title "Task Title"
        string description "Markdown/Text notes"
        int position "Sort order within column"
        string assigned_to_id FK "References users.id (SET NULL)"
        int version "Optimistic Locking Counter"
        datetime created_at
        datetime updated_at
    }

    ACTIVITY_LOG {
        string id PK "UUID"
        string tenant_id FK "References tenants.id (CASCADE)"
        string user_id FK "References users.id (SET NULL)"
        string action "TASK_CREATED | TASK_MOVED | etc."
        string entity_type "TASK | BOARD | COLUMN | TENANT"
        string entity_id "Target entity ID"
        string details "Human readable summary"
        datetime created_at
    }
```

---

## Table Relationships & Cardinality

| Parent Table | Child Table | Cardinality | Foreign Key Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `organizations` | `tenants` | 1 : N | `ON DELETE CASCADE` | Deleting an organization removes all its workspace branches. |
| `organizations` | `users` | 1 : N | `ON DELETE CASCADE` | Every user belongs to a parent organization. |
| `users` & `tenants` | `memberships` | N : M | `ON DELETE CASCADE` | Join table defining which users have access to which workspaces and their workspace role (`TENANT_ADMIN` vs `MEMBER`). |
| `tenants` | `boards` | 1 : N | `ON DELETE CASCADE` | **Tenant Isolation Boundary**: Boards belong strictly to one tenant. |
| `boards` | `columns` | 1 : N | `ON DELETE CASCADE` | Columns (`To Do`, `In Progress`, `Done`) are ordered by `position`. |
| `columns` | `tasks` | 1 : N | `ON DELETE CASCADE` | Tasks belong to columns. |
| `users` | `tasks` | 1 : N | `ON DELETE SET NULL` | Assignee relation; deleting a user unassigns tasks safely. |
| `tenants` | `activity_logs` | 1 : N | `ON DELETE CASCADE` | Persistent audit trail for actions within that workspace. |

