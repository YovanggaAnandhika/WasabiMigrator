import { ProfileInput, ProfileRecord } from "@/lib/types";

export interface ProfileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForSource?: (profile: ProfileRecord) => void;
  onSelectForTarget?: (profile: ProfileRecord) => void;
  onProfilesUpdated?: (profiles: ProfileRecord[]) => void;
}

export const PRESETS = [
  { label: "Wasabi SG", endpoint: "https://s3.ap-southeast-1.wasabisys.com", region: "ap-southeast-1" },
  { label: "Wasabi US-East", endpoint: "https://s3.wasabisys.com", region: "us-east-1" },
  { label: "Wasabi EU-Central", endpoint: "https://s3.eu-central-1.wasabisys.com", region: "eu-central-1" },
  { label: "AWS S3", endpoint: "https://s3.amazonaws.com", region: "us-east-1" },
  { label: "MinIO / Custom", endpoint: "http://localhost:9000", region: "us-east-1" },
];

export const INITIAL_FORM: ProfileInput = {
  name: "",
  endpoint_url: "https://s3.ap-southeast-1.wasabisys.com",
  region: "ap-southeast-1",
  access_key_id: "",
  secret_access_key: "",
  bucket_name: "",
  prefix: "",
  use_path_style: true,
};

export const exportProfileToCSV = (profile: ProfileRecord | ProfileInput) => {
  if (!profile.access_key_id) {
    alert("Profil ini belum memiliki Access Key ID untuk diexport.");
    return;
  }

  const csvContent =
    "User Name,Access key ID,Secret access key,Endpoint URL,Region,Bucket Name\n" +
    `"${profile.name}","${profile.access_key_id}","${profile.secret_access_key}","${profile.endpoint_url}","${profile.region}","${profile.bucket_name || ""}"\n`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = (profile.name || "wasabi_profile").toLowerCase().replace(/[^a-z0-9]/g, "_");
  link.setAttribute("href", url);
  link.setAttribute("download", `${safeName}_credentials.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
