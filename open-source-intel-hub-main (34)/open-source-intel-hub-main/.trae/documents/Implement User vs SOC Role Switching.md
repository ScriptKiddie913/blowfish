I will implement the Role-Based Access Control (RBAC) system with **User**, **SOC**, and **Admin** roles.

1.  **Database Migration**:
    -   Add `soc` to the `app_role` enum in Supabase.

2.  **Service Layer Updates** (`src/services/adminService.ts`):
    -   Create `getCurrentUserRole()` to return the specific role ('admin', 'soc', 'user').
    -   Create `updateUserRole(userId, role)` to allow admins to assign 'soc' or 'user' roles.
    -   Update `getAllUsers()` to return the full role string for the user list.

3.  **Admin Panel UI** (`src/components/osint/AdminPanel.tsx`):
    -   Replace the simple "Make Admin" button with a **Role Select Dropdown**.
    -   Admins can now toggle users between **User**, **SOC**, and **Admin**.

4.  **Access Control & Navigation** (`src/components/osint/OSINTSidebar.tsx`):
    -   **User Role**: Restricted to **Dashboard** (Garud/Phoenix Chatbot), **Monitoring** (Alerts), and **Search History** (Reports). All other tools will be hidden.
    -   **SOC Role**: Full access to all intelligence tools (Threat Pipeline, Live Threats, Dark Web, etc.), but **hidden Admin Panel**.
    -   **Admin Role**: Full access to everything.

5.  **Route Protection**:
    -   Ensure the **Floating Chatbot (Garud/Phoenix)** and **Report Button** remain accessible to all roles.

This ensures a secure, role-specific experience where standard users only see what they need, while SOC analysts get full operational capabilities without administrative risks.