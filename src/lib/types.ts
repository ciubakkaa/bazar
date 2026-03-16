import type { Database } from './database.types';

type Tables = Database['public']['Tables'];

export type University = Tables['universities']['Row'];
export type Faculty = Tables['faculties']['Row'];
export type Profile = Tables['profiles']['Row'];
export type QuizAnswers = Tables['quiz_answers']['Row'];
export type RoommatePreferences = Tables['roommate_preferences']['Row'];
export type ChecklistTemplate = Tables['checklist_templates']['Row'];
export type ChecklistProgress = Tables['checklist_progress']['Row'];
export type Conversation = Tables['conversations']['Row'];
export type Message = Tables['messages']['Row'];
export type Question = Tables['questions']['Row'];
export type Answer = Tables['answers']['Row'];
export type InviteCode = Tables['invite_codes']['Row'];

export type FacultyWithUniversity = Faculty & { university: University };

export type ProfileWithFaculty = Profile & {
	faculty: (Faculty & { university: University }) | null;
};

export type ChecklistItemWithProgress = ChecklistTemplate & {
	is_completed: boolean;
};

export type QuestionWithMeta = Question & {
	author: Profile | null;
	answer_count: number;
};

export type AnswerWithMeta = Answer & {
	author: Profile | null;
	voted_by_me: boolean;
};

export type ConversationWithPreview = Conversation & {
	last_message: { content: string; sender_id: string } | null;
	other_member: Profile | null;
	unread_count?: number;
};

export type PersonWithCompatibility = Profile & {
	faculty: Faculty | null;
	quiz_answers: QuizAnswers | null;
	roommate_preferences: RoommatePreferences | null;
	compatibility_score: number | null;
};
