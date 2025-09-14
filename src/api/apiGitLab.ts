import 'dotenv/config';
import axios from 'axios';

const header = {
  // ! Не забывать про токен чтоб не просрочился
  'PRIVATE-TOKEN': process.env.TOKEN_GIT_LAB as string,
};
export class ApiGitLab {
  static async getMR(iid: string) {
    try {
      const response = await axios.get(
        `https://${process.env.BASE_URL}/api/v4/projects/${encodeURIComponent(
          process.env.PROJECT_ID || ''
        )}/merge_requests/${iid}`,
        {
          headers: header,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching merge requests:', error);
    }
  }
}
