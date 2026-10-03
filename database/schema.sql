-- --------------------------------------------------------
-- Host:                         localhost
-- Server version:               8.0.44 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for medshield_ehr
CREATE DATABASE IF NOT EXISTS `medshield_ehr` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `medshield_ehr`;

-- Dumping structure for table medshield_ehr.audit_logs
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `resource_type` varchar(50) NOT NULL,
  `resource_id` int NOT NULL,
  `status` enum('SUCCESS','FAILURE','UNAUTHORIZED') NOT NULL DEFAULT 'SUCCESS',
  `ip_address` varchar(45) NOT NULL,
  `user_agent` varchar(255) NOT NULL,
  `details` text,
  `log_hash` varchar(64) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_log_user` (`user_id`),
  CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table medshield_ehr.break_glass_events
DROP TABLE IF EXISTS `break_glass_events`;
CREATE TABLE IF NOT EXISTS `break_glass_events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `doctor_user_id` int DEFAULT NULL,
  `patient_id` int NOT NULL,
  `justification` text,
  `access_duration_minutes` int NOT NULL DEFAULT '60',
  `expired_at` timestamp NULL DEFAULT NULL,
  `auditor_review_status` enum('pending','approved','flagged') NOT NULL DEFAULT 'pending',
  `auditor_user_id` int DEFAULT NULL,
  `auditor_notes` text,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  KEY `fk_event_doctor` (`doctor_user_id`),
  KEY `fk_event_patient` (`patient_id`),
  KEY `fk_event_auditor` (`auditor_user_id`),
  CONSTRAINT `fk_event_auditor` FOREIGN KEY (`auditor_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_event_doctor` FOREIGN KEY (`doctor_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_event_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table medshield_ehr.conditions
DROP TABLE IF EXISTS `conditions`;
CREATE TABLE IF NOT EXISTS `conditions` (
  `condition_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `diagnosed_by_doctor_id` int NOT NULL,
  `icd10_code` varchar(20) NOT NULL,
  `display_name` varchar(150) NOT NULL,
  `clinical_status` enum('active','resolved','inactive') NOT NULL DEFAULT 'active',
  `confidentiality_level` enum('normal','restricted') NOT NULL DEFAULT 'normal',
  `notes` text,
  `diagnosed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`condition_id`),
  KEY `fk_condition_patient` (`patient_id`),
  KEY `fk_condition_doctor` (`diagnosed_by_doctor_id`),
  CONSTRAINT `fk_condition_doctor` FOREIGN KEY (`diagnosed_by_doctor_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_condition_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table medshield_ehr.observations
DROP TABLE IF EXISTS `observations`;
CREATE TABLE IF NOT EXISTS `observations` (
  `observation_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `recorded_by_user_id` int NOT NULL,
  `observation_type` varchar(50) NOT NULL,
  `value` varchar(50) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `interpretation` varchar(20) NOT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`observation_id`),
  KEY `fk_observation_patient` (`patient_id`),
  KEY `fk_observation_user` (`recorded_by_user_id`),
  CONSTRAINT `fk_observation_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_observation_user` FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table medshield_ehr.patients
DROP TABLE IF EXISTS `patients`;
CREATE TABLE IF NOT EXISTS `patients` (
  `patient_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `national_id` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `blood_type` varchar(5) NOT NULL,
  `allergies` text,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_patients_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table medshield_ehr.prescriptions
DROP TABLE IF EXISTS `prescriptions`;
CREATE TABLE IF NOT EXISTS `prescriptions` (
  `prescription_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `prescripted_by_doctor_id` int NOT NULL,
  `condition_id` int DEFAULT NULL,
  `medication_name` varchar(100) NOT NULL,
  `dosage` varchar(50) NOT NULL,
  `frequency` varchar(50) NOT NULL,
  `route` varchar(20) NOT NULL,
  `status` enum('active','completed','cancelled') NOT NULL,
  `instructions` text,
  `prescribed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`prescription_id`),
  KEY `fk_prescription_patient` (`patient_id`),
  KEY `fk_prescription_doctor` (`prescripted_by_doctor_id`),
  KEY `fk_prescription_condition` (`condition_id`),
  CONSTRAINT `fk_prescription_condition` FOREIGN KEY (`condition_id`) REFERENCES `conditions` (`condition_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prescription_doctor` FOREIGN KEY (`prescripted_by_doctor_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_prescription_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table medshield_ehr.users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('doctor','nurse','patient','auditor') NOT NULL DEFAULT 'patient',
  `failed_login_attempts` int DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
