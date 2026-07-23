from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="eccp_profile",
    )
    employee_id = models.CharField("工号", max_length=16, unique=True)
    display_name = models.CharField("姓名", max_length=80)
    department = models.CharField("部门", max_length=120)
    section = models.CharField("科室", max_length=160, blank=True)
    team = models.CharField("系/班组", max_length=200, blank=True)
    job_title = models.CharField("岗位", max_length=80, blank=True)
    access_scope = models.CharField("数据范围", max_length=32, default="department")
    must_change_password = models.BooleanField("首次登录修改密码", default=True)
    allow_employee_id_login = models.BooleanField("允许工号登录", default=False)
    source_reference = models.CharField("名单来源", max_length=255, blank=True)

    class Meta:
        verbose_name = "ECCP 用户档案"
        verbose_name_plural = "ECCP 用户档案"
        permissions = [
            ("access_workspace", "访问 ECCP 工作台"),
            ("use_ai_assistant", "使用 AI 助手"),
            ("create_content", "创建和编辑内容"),
            ("manage_projects", "管理内容项目"),
            ("view_tasks", "查看和处理任务"),
            ("view_topics", "查看和搜索选题"),
            ("view_knowledge", "查看知识库"),
            ("view_analytics", "查看数据概览"),
            ("manage_platform", "管理 Agent、Skill、连接和系统设置"),
        ]

    def __str__(self):
        return f"{self.display_name} ({self.employee_id})"

    @property
    def organization_label(self):
        if self.team:
            return self.team.removeprefix(self.section)
        if self.section:
            return self.section.removeprefix(self.department)
        return self.department
