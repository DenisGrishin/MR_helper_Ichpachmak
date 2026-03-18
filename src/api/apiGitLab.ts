import 'dotenv/config';
import axios from 'axios';
import { logger } from '../config';

export class ApiGitLab {
  static async getMR(
    iid: string,
    projectPath: string,
    gitLabToken: string,
    gitBaseUrl: string,
  ) {
    try {
      logger.info(`Запрос MR #${iid} от GitLab`);

      const response = await axios.get(
        `${gitBaseUrl}/api/v4/projects/${projectPath}/merge_requests/${iid}`,
        {
          headers: {
            // ! Не забывать про токен чтоб не просрочился
            'PRIVATE-TOKEN': gitLabToken,
          },
        },
      );

      logger.info(`MR #${iid} успешно получен`);
      return response.data;
    } catch (error) {
      logger.error(
        `Ошибка при получении MR #${iid}: ${error instanceof Error ? error.message : error}`,
      );

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
