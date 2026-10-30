/* Ashkan Chef Stage 82: idempotent recipe synchronization schema. Run once against the app database. */
IF COL_LENGTH('dbo.Recipes', 'ClientId') IS NULL
    ALTER TABLE dbo.Recipes ADD ClientId nvarchar(100) NULL;
GO
IF COL_LENGTH('dbo.Recipes', 'SyncVersion') IS NULL
    ALTER TABLE dbo.Recipes ADD SyncVersion int NOT NULL CONSTRAINT DF_Recipes_SyncVersion DEFAULT (1);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Recipes_OwnerId_ClientId' AND object_id = OBJECT_ID('dbo.Recipes'))
    CREATE UNIQUE INDEX IX_Recipes_OwnerId_ClientId ON dbo.Recipes(OwnerId, ClientId) WHERE ClientId IS NOT NULL;
GO
IF OBJECT_ID('dbo.ChefRecipeSyncReceipts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChefRecipeSyncReceipts (
        Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_ChefRecipeSyncReceipts PRIMARY KEY,
        OwnerId int NOT NULL,
        IdempotencyKey nvarchar(200) NOT NULL,
        ResponseJson nvarchar(4000) NOT NULL,
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_ChefRecipeSyncReceipts_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ChefRecipeSyncReceipts_Users_OwnerId FOREIGN KEY (OwnerId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IX_ChefRecipeSyncReceipts_OwnerId_IdempotencyKey ON dbo.ChefRecipeSyncReceipts(OwnerId, IdempotencyKey);
    CREATE INDEX IX_ChefRecipeSyncReceipts_CreatedAt ON dbo.ChefRecipeSyncReceipts(CreatedAt);
END;
GO
