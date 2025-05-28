pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('jenkins-integration')
        NVD_API_KEY = credentials('nvd-api-key')
        PYTHON_VERSION = '3.10'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Code checked out successfully"
            }
        }

        stage('Setup Python Environment') {
            steps {
                sh '''
                    python3 -m venv venv
                    source venv/bin/activate
                    python3 -m pip install --upgrade pip
                    # Install build tools for pyproject.toml
                    pip install build wheel setuptools
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    source venv/bin/activate
                    # Install project in editable mode with all dependencies
                    pip install -e ".[dev]" || pip install -e .
                    # Install testing dependencies if not in pyproject.toml
                    pip install pytest pytest-cov
                '''
            }
        }

        stage('Run Tests') {
            steps {
                sh '''
                    source venv/bin/activate
                    python3 -m pytest tests/ --verbose --cov=. --cov-report=xml --cov-report=html || echo "Tests completed with issues"
                '''
            }
        }

        stage('OWASP Dependency Check') {
            steps {
                dependencyCheck additionalArguments: '''
                    --scan ./
                    --out ./
                    --format ALL
                    --prettyPrint
                    --enableRetired
                    --enableExperimental
                    --nvdApiKey ${NVD_API_KEY}
                ''', odcInstallation: 'OWASP-DepCheck'

                dependencyCheckPublisher pattern: 'dependency-check-report.xml'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarQube-Scanner'
                    withSonarQubeEnv('SonarQube-Server') {
                        sh """
                            source venv/bin/activate
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=htom-pushdep \
                            -Dsonar.projectName=htom \
                            -Dsonar.projectVersion=1.0 \
                            -Dsonar.sources=. \
                            -Dsonar.language=py \
                            -Dsonar.sourceEncoding=UTF-8 \
                            -Dsonar.python.coverage.reportPaths=coverage.xml \
                            -Dsonar.exclusions=**/venv/**,**/__pycache__/**,**/node_modules/**,**/.git/**,**/tests/**,**/*.pyc,**/migrations/**
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed'

            // Archive test results if they exist
            script {
                if (fileExists('coverage.xml')) {
                    publishCoverage adapters: [coberturaAdapter('coverage.xml')], sourceFileResolver: sourceFiles('STORE_LAST_BUILD')
                }
            }

            // Publish OWASP report
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: './',
                reportFiles: 'dependency-check-report.html',
                reportName: 'OWASP Dependency Check Report'
            ])

            // Clean up virtual environment
            sh 'rm -rf venv || true'
        }

        success {
            echo 'Pipeline succeeded!'
        }

        failure {
            echo 'Pipeline failed!'
        }
    }
}
