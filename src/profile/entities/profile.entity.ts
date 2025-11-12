export class ProfileEntity {
  profile: any;
  constructor(data: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  }) {
    this.profile = {
      username: data.username,
      bio: data.bio,
      image: data.image,
      following: data.following,
    };
  }
}
