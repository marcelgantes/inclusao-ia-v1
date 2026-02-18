CREATE TABLE `adapted_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`profileId` int NOT NULL,
	`adaptedFileName` varchar(255) NOT NULL,
	`adaptedFileUrl` text NOT NULL,
	`adaptedFileKey` varchar(512) NOT NULL,
	`adaptedFileSize` int,
	`adaptedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adapted_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` enum('pdf','docx') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileSize` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`profileName` varchar(100) NOT NULL,
	`fragmentacao` enum('baixa','media','alta') NOT NULL,
	`abstracao` enum('alta','media','baixa','nao_abstrai') NOT NULL,
	`mediacao` enum('autonomo','guiado','passo_a_passo') NOT NULL,
	`dislexia` enum('sim','nao') NOT NULL,
	`tipoLetra` enum('bastao','normal') NOT NULL,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`)
);
