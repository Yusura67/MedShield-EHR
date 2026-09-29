# MedShield-EHR

> **An Educational Reference Implementation of a Secure-by-Design Healthcare Web Application Compliant with ISO 27799, OWASP ASVS (Level 2), and HL7 FHIR Standards.**

[![Security Verification](https://img.shields.io/badge/Security-OWASP%20ASVS%20v4.0%20L2-blue.svg)](https://owasp.org/www-project-application-security-verification-standard/)
[![Compliance](https://img.shields.io/badge/Compliance-ISO%2027799%20%2F%20ISO%2027001-green.svg)](https://www.iso.org/standard/62777.html)
[![Healthcare Standard](https://img.shields.io/badge/Healthcare-HL7%20FHIR%20R4-orange.svg)](https://hl7.org/fhir/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[🇹🇭 คลิกที่นี่เพื่ออ่านเวอร์ชันภาษาไทย (README.th.md)](./README.th.md)

---

## Project Objectives & Overview

**MedShield-EHR** is an **educational study project and reference implementation (Proof-of-Concept)** developed to explore how **international cybersecurity standards** can be practically applied to modern web applications.

### Core Objectives:
1. **Hands-on Standards Application:** Bridging the gap between theoretical compliance frameworks (ISO 27799, OWASP ASVS v4.0, and HL7 FHIR) and actual engineering artifacts (database schemas, security middleware, and cryptographic controls).
2. **Fostering Security Awareness:** Demonstrating the necessity of the **Security-by-Design** mindset, particularly in handling sensitive electronic Protected Health Information (ePHI).
3. **Open Educational Reference:** Serving as a practical case study for mitigating critical web vulnerabilities (OWASP Top 10, BOLA/IDOR, and credential stuffing) through field-level encryption, granular RBAC, and tamper-evident audit trails.

> **Disclaimer:** This repository is developed solely for academic and educational purposes to demonstrate secure software engineering principles. It is not intended for commercial deployment in live hospital environments.

---

## International Standards Explored & Implemented

| Standard | Domain | Implementation in MedShield-EHR |
| :--- | :--- | :--- |
| **ISO 27799 / ISO 27001** | Health Informatics & ISMS | Role-Based Access Control (RBAC), Separation of Duties, Tamper-Evident Audit Logging, and Emergency "Break-Glass" Access Protocol. |
| **OWASP ASVS v4.0 (Level 2)** | Web Application Security | Field-level AES-256-GCM encryption for ePHI, strict input validation, anti-BOLA/IDOR authorization guards, and security headers. |
| **HL7 FHIR (Release 4)** | Healthcare Interoperability | Standardized JSON clinical resources (`Patient`, `Observation`, `Condition`) and scoped healthcare API endpoints. |
| **NIST SP 800-63B** | Digital Identity & Auth | Secure password hashing (Argon2id/Bcrypt), automated account lockout (Brute-force protection), and secure session management. |

---

## Key Cybersecurity Features Studied

### 1. Emergency "Break-Glass" Protocol (ISO 27799)
Demonstrates emergency access override in critical scenarios where an on-duty doctor needs urgent access to an unassigned patient:
* Requires explicit clinical justification before grant.
* Emits a real-time security alert to the Auditor.
* Generates an unalterable audit log entry for post-incident review.

### 2. Field-Level Encryption at Rest (OWASP ASVS V6)
High-risk ePHI fields (National IDs and confidential medical notes) are encrypted using **AES-256-GCM** before database ingestion, with encryption keys decoupled from the database.

### 3. Automated Brute-Force & Credential Stuffing Defense (NIST SP 800-63B)
Account authentication includes incremental failure tracking (`failed_login_attempts`) and time-based lockouts (`locked_until`), mitigating automated dictionary attacks.

### 4. Tamper-Evident Audit Logging (FHIR `AuditEvent`)
Every sensitive read, write, or override action is recorded following the HL7 FHIR `AuditEvent` schema, timestamped and bound with cryptographic hashing to prevent tampering.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.