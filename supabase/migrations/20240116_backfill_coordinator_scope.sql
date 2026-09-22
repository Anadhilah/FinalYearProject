-- Keep approved department coordinator profiles aligned with their requests.

update "User" u
set
  "institutionId" = coalesce(r."institutionId", matched_department."institutionId"),
  "facultyId" = coalesce(r."facultyId", matched_department."facultyId"),
  "departmentId" = coalesce(r."departmentId", matched_department.id),
  "updatedAt" = now()
from "DepartmentCoordinatorRequest" r
left join "Department" matched_department
  on lower(trim(matched_department.name)) = lower(trim(r."departmentName"))
 and (
   r."institutionId" is not null
   or r."institutionName" is null
   or exists (
     select 1
     from "Institution" matched_institution
     where matched_institution.id = matched_department."institutionId"
       and lower(trim(matched_institution.name)) = lower(trim(r."institutionName"))
   )
 )
where r."userId" = u.id
  and r.status in ('APPROVED', 'ACTIVE')
  and u.role = 'DEPARTMENT_COORDINATOR'::"Role"
  and (
    r."institutionId" is not null
    or r."facultyId" is not null
    or r."departmentId" is not null
    or matched_department.id is not null
  );