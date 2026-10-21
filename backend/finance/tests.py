from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from .models import Income, Expense, Budget, SavingsGoal


class BudgetBuddyAPITests(TestCase):

    def setUp(self):

        self.user = User.objects.create_user(
            username="testuser",
            password="TestPassword123"
        )

        self.client = APIClient()

        self.client.force_authenticate(
            user=self.user
        )

    # =====================================================
    # ANALYTICS API TEST
    # =====================================================

    def test_analytics_api(self):

        Income.objects.create(
            user=self.user,
            source="Salary",
            amount=5000,
            date="2026-09-01"
        )

        Expense.objects.create(
            user=self.user,
            category="Food",
            amount=1000,
            date="2026-09-05"
        )

        response = self.client.get(
            "/analytics/?month=2026-09"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            float(response.data["summary"]["total_income"]),
            5000.0
        )

        self.assertEqual(
            float(response.data["summary"]["total_expenses"]),
            1000.0
        )

        self.assertEqual(
            float(response.data["summary"]["remaining_amount"]),
            4000.0
        )

    # =====================================================
    # MONTHLY REPORT API TEST
    # =====================================================

    def test_monthly_report_api(self):

        Income.objects.create(
            user=self.user,
            source="Salary",
            amount=5000,
            date="2026-09-01"
        )

        Expense.objects.create(
            user=self.user,
            category="Food",
            amount=1000,
            date="2026-09-05"
        )

        response = self.client.get(
            "/reports/monthly/?month=2026-09"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            float(response.data["summary"]["total_income"]),
            5000.0
        )

        self.assertEqual(
            float(response.data["summary"]["total_expenses"]),
            1000.0
        )

        self.assertEqual(
            float(response.data["summary"]["savings"]),
            4000.0
        )

    # =====================================================
    # USER DATA ISOLATION TEST
    # =====================================================

    def test_user_data_isolation(self):

        other_user = User.objects.create_user(
            username="otheruser",
            password="OtherPassword123"
        )

        Income.objects.create(
            user=other_user,
            source="Other Salary",
            amount=99999,
            date="2026-09-01"
        )

        response = self.client.get(
            "/incomes/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        for income in response.data:

            self.assertNotEqual(
                income["amount"],
                99999
            )

    # =====================================================
    # INVALID MONTH TEST
    # =====================================================

    def test_invalid_month(self):

        response = self.client.get(
            "/reports/monthly/?month=invalid"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    # =====================================================
    # EMPTY MONTH TEST
    # =====================================================

    def test_empty_month_report(self):

        response = self.client.get(
            "/reports/monthly/?month=2025-01"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            float(response.data["summary"]["total_income"]),
            0.0
        )

        self.assertEqual(
            float(response.data["summary"]["total_expenses"]),
            0.0
        )

        self.assertEqual(
            float(response.data["summary"]["savings"]),
            0.0
        )