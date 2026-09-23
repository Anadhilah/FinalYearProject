-- Match the deployed CoordinatorAssignment scopeType constraint.

alter table "CoordinatorAssignment"
	alter column "scopeType" set default 'student-group';
