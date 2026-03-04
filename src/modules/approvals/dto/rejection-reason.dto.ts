export class RejectionReasonDto {
    value: string;
    label: string;
}

export const PREDEFINED_REJECTION_REASONS: RejectionReasonDto[] = [
    { value: 'gambling_content', label: 'Gambling content' },
    { value: 'adult_sexual_content', label: 'Adult / sexual content' },
    { value: 'illegal_services', label: 'Illegal services' },
    { value: 'misleading_content', label: 'Misleading content' },
    { value: 'other', label: 'Other (manual reason input)' },
];
