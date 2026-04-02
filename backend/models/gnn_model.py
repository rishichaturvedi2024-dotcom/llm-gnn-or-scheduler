import torch
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv


class SurgicalSynergyGNN(torch.nn.Module):
    def __init__(self, input_dim=5, hidden_dim=64, embed_dim=32):
        super().__init__()
        self.conv1 = SAGEConv(input_dim, hidden_dim)
        self.conv2 = SAGEConv(hidden_dim, embed_dim)
        self.predictor = torch.nn.Linear(embed_dim * 3, 1)

    def encode(self, x, edge_index):
        x = F.relu(self.conv1(x, edge_index))
        x = F.dropout(x, p=0.2, training=self.training)
        x = self.conv2(x, edge_index)
        return x

    def predict_duration(self, embeddings, team_indices):
        team_embeds = embeddings[team_indices]
        team_vec = team_embeds.view(team_embeds.size(0), -1)
        return self.predictor(team_vec).squeeze(-1)

    def forward(self, data, team_indices):
        embeddings = self.encode(data.x, data.edge_index)
        duration = self.predict_duration(embeddings, team_indices)
        return embeddings, duration
