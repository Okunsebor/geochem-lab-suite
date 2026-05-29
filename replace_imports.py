import os
import glob

# Map of old substrings to new substrings
replacements = {
    "@/components/lims/app-topbar": "@/components/layout/AppTopbar",
    "../components/lims/app-topbar": "../components/layout/AppTopbar",
    "../../components/lims/app-topbar": "../../components/layout/AppTopbar",
    "../../../components/lims/app-topbar": "../../../components/layout/AppTopbar",
    
    "@/components/lims/app-sidebar": "@/components/layout/AppSidebar",
    "../components/lims/app-sidebar": "../components/layout/AppSidebar",
    "../../components/lims/app-sidebar": "../../components/layout/AppSidebar",
    "../../../components/lims/app-sidebar": "../../../components/layout/AppSidebar",
    
    "@/components/lims/page-header": "@/components/layout/PageHeader",
    "../components/lims/page-header": "../components/layout/PageHeader",
    "../../components/lims/page-header": "../../components/layout/PageHeader",
    "../../../components/lims/page-header": "../../../components/layout/PageHeader",
    
    "@/components/lims/stat-card": "@/components/shared/StatCard",
    "../components/lims/stat-card": "../components/shared/StatCard",
    "../../components/lims/stat-card": "../../components/shared/StatCard",
    "../../../components/lims/stat-card": "../../../components/shared/StatCard",
    
    "@/components/lims/status-badge": "@/components/shared/StatusBadge",
    "../components/lims/status-badge": "../components/shared/StatusBadge",
    "../../components/lims/status-badge": "../../components/shared/StatusBadge",
    "../../../components/lims/status-badge": "../../../components/shared/StatusBadge",
}

for filepath in glob.glob("src/**/*.tsx", recursive=True) + glob.glob("src/**/*.ts", recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
