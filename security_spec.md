# Firestore Security Specification

This specification governs the database security invariants and write rules for the **雲端誦經共修回報系統** (Cloud Chanting Recitation Reporting System).

## 1. Data Invariants
- **Recitation Records (`/recitations/{id}`)**:
  - Once created, recitation records are immutable. No updates or deletions are allowed by clients to protect historic dedication listings.
  - A record must define a valid `reporterName` (up to 100 characters), a non-empty `sutraId` and `sutraName` (matching the chanting catalog), an integer `count` greater than or equal to 1, and the current server timestamp.
  - Optional `dedication` (up to 2000 characters) and `userId` (up to 128 characters) are supported.
  - Timestamps must correspond to the request server time (`request.time`).

- **Sutra Aggregated Totals (`/sutra_totals/{sutraId}`)**:
  - Anyone can read/list aggregation totals.
  - Creating or updating is allowed to keep global totals updated.
  - During updates, `sutraId` and `sutraName` are strictly immutable.
  - The `totalCount` can only increase (`incoming().totalCount >= existing().totalCount`).
  - `lastUpdatedAt` must equal the server time `request.time`.

---

## 2. The "Dirty Dozen" Malicious Payloads

We define 12 malicious payloads designed to challenge integrity and rules:

1. **Spoofed Sign-in / ID injection**: Writing to `recitations` using someone else's `userId`.
2. **Infinite Character Name**: Submit `reporterName` with 10MB of generated characters to exhaust DB reads.
3. **Negative Count**: Submit a recitation report with `count: -500`.
4. **Fractional Count**: Submit a recitation with `count: 5.5` to pollute counting.
5. **Zero Count**: Submit a recitation with `count: 0`.
6. **Time-Traveling Record**: Submit `timestamp` in 2050 to override recent feeds ordering.
7. **Phantom Fields Injection**: Submit unexpected fields like `{ admin: true, hack: "yes" }` inside the recitation payload.
8. **Malicious Record Deletion**: A client attempts to delete existing recitations of another user.
9. **Tampered Recitation Update**: A user attempts to update their previous recitation to change the chanted sutra or the count.
10. **Sutra Total Decrementation**: Tampering with `/sutra_totals` to decrease the total count.
11. **Total Name Spoofing**: Updating a sutra total and changing the name (e.g. changing "般若波羅蜜多心經" to "大悲咒").
12. **Spamming Massive IDs**: Injecting 1.5KB long weird strings as IDs to pollute document list queries.

---

## 3. Security Rules Matrix

| Collection | Create Rule | Update Rule | Delete Rule | Get/List Rule |
| :--- | :--- | :--- | :--- | :--- |
| `recitations` | Auth check or guest valid, schema validity, server time. | `false` (Immutable) | `false` | `true` (Public roll) |
| `sutra_totals` | Schema validation, server time. | Schema check, total increment, key immutability. | `false` | `true` (Public rollup) |
