from decimal import Decimal

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator


# PROFILE
class Profile(models.Model):

    ROLE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Admin'),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='user'
    )

    phone_number = models.CharField(
        max_length=15,
        blank=True
    )

    date_of_birth = models.DateField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.user.username


# INCOME
class Income(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    source = models.CharField(
        max_length=100
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01"))
        ]
    )

    date = models.DateField()

    description = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.source


# EXPENSE
class Expense(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    category = models.CharField(
        max_length=100
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01"))
        ]
    )

    date = models.DateField()

    description = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.category


# BUDGET
class Budget(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    category = models.CharField(
        max_length=100
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01"))
        ]
    )

    month = models.DateField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    'user',
                    'category',
                    'month'
                ],
                name='unique_user_category_month_budget'
            )
        ]

    def __str__(self):
        return self.category


# SAVINGS GOAL
class SavingsGoal(models.Model):

    STATUS_CHOICES = (
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    goal_name = models.CharField(
        max_length=100
    )

    target_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01"))
        ]
    )

    current_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[
            MinValueValidator(Decimal("0"))
        ]
    )

    deadline = models.DateField(
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='in_progress'
    )

    def update_status(self):

        if self.current_amount >= self.target_amount:
            self.status = 'completed'
        else:
            self.status = 'in_progress'

    @property
    def progress_percentage(self):

        if self.target_amount <= 0:
            return Decimal("0.00")

        progress = (
            self.current_amount /
            self.target_amount
        ) * Decimal("100")

        return min(
            progress,
            Decimal("100.00")
        )

    def save(self, *args, **kwargs):

        self.update_status()

        super().save(*args, **kwargs)

    def __str__(self):
        return self.goal_name


# NOTIFICATION
class Notification(models.Model):

    TYPE_CHOICES = (
        ('budget_limit', 'Budget Limit Alert'),
        ('savings_reminder', 'Savings Reminder'),
        ('monthly_report', 'Monthly Report Notification'),
        ('goal_milestone', 'Goal Milestone Alert'),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    notification_type = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
        default='budget_limit'
    )

    message = models.TextField()

    related_object_id = models.PositiveIntegerField(
        blank=True,
        null=True
    )

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.message


# REPORT
class Report(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    report_type = models.CharField(
        max_length=100
    )

    generated_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.report_type