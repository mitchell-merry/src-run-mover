import * as SRC from "src-ts"

export interface LeaderboardPartial {
	game: string;
	category: string;
	level?: string;
	variables: NonNullable<SRC.PostRun['variables']>;
}