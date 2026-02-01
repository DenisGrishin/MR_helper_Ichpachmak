import 'dotenv/config';
import axios from 'axios';

export class ApiGitLab {
  static async getMR(iid: string, projectPath: string, gitLabToken: string) {
    try {
      const response = await axios.get(
        `https://${process.env.BASE_URL}/api/v4/projects/${
          projectPath
        }/merge_requests/${iid}`,
        {
          headers: {
            // ! Не забывать про токен чтоб не просрочился
            'PRIVATE-TOKEN': gitLabToken,
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `GitLab API error (${error.response?.status}): ${
            error.response?.data?.message ?? error.message
          }`,
        );
      }

      throw error;
    }
  }
}
