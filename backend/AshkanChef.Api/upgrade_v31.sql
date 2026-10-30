-- Run once on an EXISTING AshkanChef SQL Server database, after taking a backup.
-- Legacy rows did not have a publication timestamp. Their exact historical dates cannot be recovered.
-- Legacy records are marked with the migration time, not a fabricated historical date.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF COL_LENGTH('dbo.Recipes','CreatedAt') IS NULL
BEGIN
 ALTER TABLE dbo.Recipes ADD CreatedAt datetime2(7) NOT NULL CONSTRAINT DF_Recipes_CreatedAt DEFAULT SYSUTCDATETIME();
END;
IF COL_LENGTH('dbo.Recipes','UpdatedAt') IS NULL
BEGIN
 ALTER TABLE dbo.Recipes ADD UpdatedAt datetime2(7) NULL;
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.Recipes') AND name='IX_Recipes_OwnerId_CreatedAt_Id')
 CREATE INDEX IX_Recipes_OwnerId_CreatedAt_Id ON dbo.Recipes(OwnerId,CreatedAt DESC,Id DESC);
COMMIT TRANSACTION;
