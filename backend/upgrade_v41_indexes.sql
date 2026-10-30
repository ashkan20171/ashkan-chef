-- Stage 41: optional, idempotent SQL Server indexes for dashboard queries.
-- Confirm actual table names against your EF Core migrations before executing.
-- Take a backup first. Execute only once deployment schema is validated.
IF OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Reviews') AND name = N'IX_Reviews_RecipeId_Rating')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Reviews_RecipeId_Rating
    ON dbo.Reviews (RecipeId) INCLUDE (Rating);
END;
GO
