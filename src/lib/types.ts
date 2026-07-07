export type Issue = {
  id: string;
  issue_number: number;
  title: string;
  cover_url: string;
  pdf_url: string;
  published_at: string | null;
};

export type Piece = {
  id: string;
  issue_id: string | null;
  title: string;
  author_first_name: string;
  class_year: string;
  pdf_url: string;
  napkin_variant: number;
  font_preset: number;
};
