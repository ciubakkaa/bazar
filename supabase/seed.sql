-- Seed data for Bazar
-- Universities with deterministic UUIDs

INSERT INTO universities (id, name, short_name, email_domain, city) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Universitatea Națională de Știință și Tehnologie POLITEHNICA București', 'UPB', 'stud.upb.ro', 'București'),
  ('11111111-0000-0000-0000-000000000002', 'Academia de Studii Economice din București', 'ASE', 'stud.ase.ro', 'București'),
  ('11111111-0000-0000-0000-000000000003', 'Universitatea din București', 'UB', 'stud.unibuc.ro', 'București');

-- UPB Faculties
INSERT INTO faculties (university_id, name, short_name) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Facultatea de Automatică și Calculatoare', 'ACS'),
  ('11111111-0000-0000-0000-000000000001', 'Facultatea de Electronică, Telecomunicații și Tehnologia Informației', 'ETTI'),
  ('11111111-0000-0000-0000-000000000001', 'Facultatea de Inginerie Mecanică și Mecatronică', 'IMST'),
  ('11111111-0000-0000-0000-000000000001', 'Facultatea de Inginerie Electrică', 'IE'),
  ('11111111-0000-0000-0000-000000000001', 'Facultatea de Inginerie în Limbi Străine', 'FILS');

-- ASE Faculties
INSERT INTO faculties (university_id, name, short_name) VALUES
  ('11111111-0000-0000-0000-000000000002', 'Facultatea de Cibernetică, Statistică și Informatică Economică', 'CSIE'),
  ('11111111-0000-0000-0000-000000000002', 'Facultatea de Management', 'MAN'),
  ('11111111-0000-0000-0000-000000000002', 'Facultatea de Finanțe, Asigurări, Bănci și Burse de Valori', 'FABBV'),
  ('11111111-0000-0000-0000-000000000002', 'Facultatea de Marketing', 'MK'),
  ('11111111-0000-0000-0000-000000000002', 'Facultatea de Relații Economice Internaționale', 'REI');

-- UB Faculties
INSERT INTO faculties (university_id, name, short_name) VALUES
  ('11111111-0000-0000-0000-000000000003', 'Facultatea de Matematică și Informatică', 'FMI'),
  ('11111111-0000-0000-0000-000000000003', 'Facultatea de Drept', 'FD'),
  ('11111111-0000-0000-0000-000000000003', 'Facultatea de Litere', 'FL'),
  ('11111111-0000-0000-0000-000000000003', 'Facultatea de Științe Politice', 'FSPUB'),
  ('11111111-0000-0000-0000-000000000003', 'Facultatea de Geografie', 'FG');

-- Generic checklist items (university_id = NULL, apply to all universities)
INSERT INTO checklist_templates (university_id, title, description, category, deadline_description, sort_order) VALUES
  (NULL,
   'Confirmă locul la facultate',
   'Accesează platforma de admitere a universității tale și confirmă locul obținut. De obicei ai nevoie de o copie a diplomei de bacalaureat și a foii matricole.',
   'documents',
   'În termen de 2-3 zile de la afișarea rezultatelor',
   1),
  (NULL,
   'Plătește taxa de înmatriculare',
   'Achită taxa de înmatriculare prin transfer bancar sau la casieria universității. Păstrează chitanța — o vei folosi la dosar.',
   'documents',
   'Înainte de termenul limită din contractul de studii',
   2),
  (NULL,
   'Fă-ți adeverința medicală',
   'Mergi la medicul de familie pentru adeverința medicală necesară la înscriere. Include analizele de bază (test sânge, urina, plămâni).',
   'health',
   'Înainte de depunerea dosarului de înmatriculare',
   3),
  (NULL,
   'Depune cererea pentru cămin',
   'Completează cererea de cazare în cămin pe platforma universității. Ai nevoie de adeverința de venit a părinților și alte documente specifice.',
   'housing',
   'De obicei iulie-august, verifică termenele universității',
   4),
  (NULL,
   'Activează emailul universitar',
   'Verifică-ți emailul universitar (de obicei pe domeniul universității). Vei primi instrucțiunile de activare pe emailul personal.',
   'registration',
   'În prima săptămână după înmatriculare',
   5),
  (NULL,
   'Fă-ți legitimația de student',
   'Ridică legitimația de student de la secretariatul facultății. Ai nevoie de o poză tip buletin și de confirmarea înmatriculării.',
   'campus',
   'În primele 2 săptămâni de facultate',
   6),
  (NULL,
   'Fă-ți abonamentul STB/transport redus',
   'Cu legitimația de student poți obține abonament redus la transport în comun. Mergi la un ghișeu STB/metrou cu legitimația și buletinul.',
   'transport',
   'Oricând după ce ai legitimația de student',
   7),
  (NULL,
   'Înscrie-te la cursuri / vezi orarul',
   'Verifică orarul grupei tale pe site-ul facultății sau pe platforma internă. Unele facultăți necesită înscriere la cursuri opționale.',
   'registration',
   'Înainte de începerea semestrului',
   8),
  (NULL,
   'Explorează campusul',
   'Fă un tur al campusului: găsește sălile de curs, biblioteca, cantina, copiatorul și secretariatul. Notează-ți locațiile importante.',
   'campus',
   'În prima săptămână de facultate',
   9),
  (NULL,
   'Descarcă aplicațiile necesare',
   'Instalează aplicațiile universității (portal studenti, Teams/Zoom, platforma de e-learning). Verifică dacă ai acces cu contul universitar.',
   'registration',
   'Înainte de prima zi de cursuri',
   10);
