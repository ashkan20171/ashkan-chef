-- Backup database before executing. SQL Server, idempotent schema upgrade.
IF COL_LENGTH('dbo.Follows', 'CreatedAt') IS NULL
BEGIN
 ALTER TABLE dbo.Follows ADD CreatedAt datetime2 NULL;
 UPDATE dbo.Follows SET CreatedAt = SYSUTCDATETIME() WHERE CreatedAt IS NULL;
 ALTER TABLE dbo.Follows ALTER COLUMN CreatedAt datetime2 NOT NULL;
END;
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id=OBJECT_ID('dbo.Follows') AND parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.Follows'),'CreatedAt','ColumnId'))
 ALTER TABLE dbo.Follows ADD CONSTRAINT DF_Follows_CreatedAt DEFAULT SYSUTCDATETIME() FOR CreatedAt;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.Follows') AND name='IX_Follows_FollowedId_CreatedAt')
 CREATE INDEX IX_Follows_FollowedId_CreatedAt ON dbo.Follows(FollowedId,CreatedAt);
-- Historic follows receive migration time; historical growth cannot be reconstructed.
