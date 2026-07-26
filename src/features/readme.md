# features/users/ (Deep Example)

features/users/
│
├── pages/
│   └── UsersPage.tsx
│
├── components/
│   ├── UserTable.tsx
│   ├── UserRow.tsx
│   └── UserActions.tsx
│
├── hooks/
│   └── useUsers.ts
│
├── api/
│   └── users.api.ts
│
├── types.ts
├── constants.ts
└── index.ts

| Rule                   | Meaning           |
| ---------------------- | ----------------- |
| Feature owns its UI    | No cross-imports  |
| Feature owns its data  | APIs live here    |
| Feature owns its state | No leaking        |
| Feature deletable      | One folder = gone |
