from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Income,
    Expense,
    Budget,
    SavingsGoal,
    Notification,
    Profile
)


# ============================================================
# USER REGISTRATION
# ============================================================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password'
        ]

    def create(self, validated_data):

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

        Profile.objects.create(
            user=user,
            role='user'
        )

        return user


# ============================================================
# INCOME
# ============================================================

class IncomeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Income
        fields = '__all__'
        read_only_fields = ['user']

    def validate_amount(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                "Income amount must be greater than 0."
            )

        return value


# ============================================================
# EXPENSE
# ============================================================

class ExpenseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['user']

    def validate_amount(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                "Expense amount must be greater than 0."
            )

        return value

    def validate_category(self, value):

        allowed_categories = [
            "Food",
            "Travel",
            "Shopping",
            "Education",
            "Entertainment",
            "Miscellaneous"
        ]

        if value not in allowed_categories:
            raise serializers.ValidationError(
                "Invalid expense category."
            )

        return value


# ============================================================
# BUDGET
# ============================================================

class BudgetSerializer(serializers.ModelSerializer):

    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ['user']

    def validate_amount(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                "Budget amount must be greater than 0."
            )

        return value

    def validate_category(self, value):

        allowed_categories = [
            "Food",
            "Travel",
            "Shopping",
            "Education",
            "Entertainment",
            "Miscellaneous"
        ]

        if value not in allowed_categories:
            raise serializers.ValidationError(
                "Invalid budget category."
            )

        return value

    def validate(self, attrs):

        user = self.context['request'].user

        category = attrs.get(
            'category',
            getattr(
                self.instance,
                'category',
                None
            )
        )

        month = attrs.get(
            'month',
            getattr(
                self.instance,
                'month',
                None
            )
        )

        existing_budget = Budget.objects.filter(
            user=user,
            category=category,
            month=month
        )

        if self.instance:

            existing_budget = existing_budget.exclude(
                pk=self.instance.pk
            )

        if existing_budget.exists():

            raise serializers.ValidationError(
                "A budget already exists for this category and month."
            )

        return attrs


# ============================================================
# SAVINGS GOAL
# ============================================================

class SavingsGoalSerializer(serializers.ModelSerializer):

    progress_percentage = serializers.ReadOnlyField()

    class Meta:
        model = SavingsGoal

        fields = [
            'id',
            'user',
            'goal_name',
            'target_amount',
            'current_amount',
            'progress_percentage',
            'status',
            'deadline'
        ]

        read_only_fields = [
            'user',
            'progress_percentage',
            'status'
        ]

    def validate_goal_name(self, value):

        if not value.strip():

            raise serializers.ValidationError(
                "Goal name is required."
            )

        return value.strip()

    def validate_target_amount(self, value):

        if value <= 0:

            raise serializers.ValidationError(
                "Target amount must be greater than 0."
            )

        return value

    def validate_current_amount(self, value):

        if value < 0:

            raise serializers.ValidationError(
                "Current amount cannot be negative."
            )

        return value

    def validate(self, attrs):

        target_amount = attrs.get(
            'target_amount',
            getattr(
                self.instance,
                'target_amount',
                None
            )
        )

        current_amount = attrs.get(
            'current_amount',
            getattr(
                self.instance,
                'current_amount',
                0
            )
        )

        if (
            target_amount is not None
            and current_amount > target_amount
        ):

            raise serializers.ValidationError({
                'current_amount':
                    'Current amount cannot exceed target amount.'
            })

        return attrs


# ============================================================
# NOTIFICATION
# ============================================================

class NotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notification

        fields = [
            'id',
            'user',
            'notification_type',
            'message',
            'related_object_id',
            'is_read',
            'created_at'
        ]

        read_only_fields = [
            'user',
            'is_read',
            'created_at'
        ]

    def validate_notification_type(self, value):

        allowed_types = [
            'budget_limit',
            'savings_reminder',
            'monthly_report',
            'goal_milestone'
        ]

        if value not in allowed_types:

            raise serializers.ValidationError(
                "Invalid notification type."
            )

        return value