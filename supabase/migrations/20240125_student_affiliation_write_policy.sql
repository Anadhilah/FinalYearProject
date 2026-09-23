-- Allow students to create and maintain their own institution affiliation during onboarding.

grant insert, update on table "StudentInstitutionAffiliation" to authenticated;

drop policy if exists "Students manage own institution affiliation" on "StudentInstitutionAffiliation";
create policy "Students manage own institution affiliation" on "StudentInstitutionAffiliation"
  for all using (auth.uid()::text = "studentId")
  with check (auth.uid()::text = "studentId");