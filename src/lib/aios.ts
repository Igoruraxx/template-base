/**
 * Serviço de Integração com AIOS Kernel
 * Permite que o frontend Lovab execute agentes em Python rodando no Kernel local.
 */

const AIOS_KERNEL_URL = 'http://localhost:8005';

export interface AgentExecutionResponse {
  execution_id: string;
  status: string;
}

export interface AgentResult {
  execution_id: string;
  status: string;
  result?: any;
  error?: string;
}

export const aiosService = {
  /**
   * Envia uma tarefa para um agente específico no Kernel
   * @param agentPath Caminho ou nome do agente (ex: "example/academic_agent")
   * @param task Descrição da tarefa
   */
  async executeAgent(agentPath: string, task: string): Promise<AgentExecutionResponse> {
    const response = await fetch(`${AIOS_KERNEL_URL}/agents/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentPath,
        agent_config: {
          task: task
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao conectar com AIOS Kernel: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtém o status/resultado de uma execução
   * @param executionId ID retornado pelo executeAgent
   */
  async getStatus(executionId: string): Promise<AgentResult> {
    const response = await fetch(`${AIOS_KERNEL_URL}/agents/${executionId}/status`);
    
    if (!response.ok) {
      throw new Error(`Erro ao consultar status: ${response.statusText}`);
    }

    return response.json();
  }
};
